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

        //Initialize the ledger account and first element of the locks vector
        ledger_account.locks = Vec::new();

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

        // Create a new TokenLock instance
        let new_lock = TokenLock {
            amount,
            timestamp: Clock::get()?.unix_timestamp,
            // Initialize other fields as needed
        };

        // Add the new lock to the ledger
        ledger_account.locks.push(new_lock);

        Ok(())
    }

    pub fn withdraw_funds(
        ctx: Context<WithdrawFunds>,
        amount: u64,
        lock_index: u64,
    ) -> Result<()> {
        let ledger_account = &mut ctx.accounts.ledger_account;
        let wallet = &ctx.accounts.wallet;

        let lockindex = lock_index as usize;

        // Check if the lock_index is valid
        if lockindex >= ledger_account.locks.len() {
            return Err(ErrorCode::LockIndexOutOfBounds.into());
        }

        // Temporarily remove the lock from the vector for processing
        let mut lock = ledger_account.locks.remove(lockindex);

        // Ensure there are sufficient funds in the lock
        if lock.amount < amount {
            // If insufficient funds, add the lock back to the ledger before returning error
            ledger_account.locks.insert(lockindex, lock);
            return Err(ErrorCode::InsufficientFunds.into());
        }

        // Perform the fund transfer
        **ledger_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **wallet.to_account_info().try_borrow_mut_lamports()? += amount;

        // Update the amount in the lock
        lock.amount -= amount;

        // Re-insert the lock back into the ledger
        ledger_account.locks.insert(lockindex, lock);

        Ok(())
    }


}

#[derive(Accounts)]
pub struct CreateLedger<'info> {
    #[account(
    init,
    payer = wallet,
    space = 8 + 640,
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
    #[msg("Lock index out of bounds")]
    LockIndexOutOfBounds,
}

#[account]
pub struct Ledger {
    pub locks: Vec<TokenLock>,
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct TokenLock {
    amount: u64,
    timestamp: i64,
}
