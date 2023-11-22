use anchor_lang::prelude::*;
use solana_program::program::invoke;
use solana_program::system_instruction;

declare_id!("9jEs9Sy93JMhY8VsVA7Z5TPA6Mi6eRWVBMWMcqppr1Ss");

#[program]
pub mod pdas {
    use super::*;

    pub fn create_ledger(
        ctx: Context<CreateLedger>,
    ) -> Result<()> {
        let ledger_account = &mut ctx.accounts.ledger_account;
        ledger_account.locked_amount = 0;
        ledger_account.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn deposit_funds(
        ctx: Context<DepositFunds>,
        amount: u64,
    ) -> Result<()> {
        let ledger_account = &mut ctx.accounts.ledger_account;
        let wallet = &ctx.accounts.wallet;
        let system_program = &ctx.accounts.system_program;


        // Transfer funds from the wallet to the ledger account
        invoke(
            &system_instruction::transfer(
                wallet.to_account_info().key,
                ledger_account.to_account_info().key,
                amount,
            ),
            &[
                wallet.to_account_info(),
                ledger_account.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;

        // Update the ledger balance
        ledger_account.locked_amount = ledger_account.locked_amount.checked_add(amount).ok_or_else(|| {
            anchor_lang::error!(ErrorCode::Overflow)
        })?;

        Ok(())
    }

    pub fn withdraw_funds(
        ctx: Context<WithdrawFunds>,
        amount: u64,
    ) -> Result<()> {
        let ledger_account = &mut ctx.accounts.ledger_account;
        let wallet = &ctx.accounts.wallet;

        // Ensure that the caller is the owner of the PDA
        // if *ledger_account.to_account_info().key != *wallet.to_account_info().key {
        //     return Err(ErrorCode::NotAuthorized.into());
        // }

        // Check if there are sufficient funds in the PDA to withdraw
        if ledger_account.locked_amount < amount {
            return Err(ErrorCode::InsufficientFunds.into());
        }

        **ledger_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **wallet.to_account_info().try_borrow_mut_lamports()? += amount;

        // Update the ledger balance
        ledger_account.locked_amount -= amount;

        Ok(())
    }

}

#[derive(Accounts)]
pub struct CreateLedger<'info> {
    #[account(
    init,
    payer = wallet,
    space = 8 + 128,
    seeds = [wallet.key().as_ref(), b"_"],
    bump
    )]
    pub ledger_account: Account<'info, Ledger>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyLedger<'info> {
    #[account(mut)]
    pub ledger_account: Account<'info, Ledger>,
    #[account(mut)]
    pub wallet: Signer<'info>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(mut)]
    pub ledger_account: Account<'info, Ledger>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut, signer)]
    pub wallet: Signer<'info>,
    #[account(mut)]
    pub ledger_account: Account<'info, Ledger>,
    pub system_program: Program<'info, System>,
}


#[error_code]
pub enum ErrorCode {
    #[msg("Overflow when adding to the balance")]
    Overflow,
    #[msg("Insufficient funds for the transaction")]
    InsufficientFunds,
    #[msg("Failed to retrieve balance")]
    BalanceRetrievalFailure,
    #[msg("Not authorized to perform this action")]
    NotAuthorized,
}

#[account]
pub struct Ledger {
    pub locked_amount: u64,
    pub timestamp: i64, // Add the timestamp field
}
