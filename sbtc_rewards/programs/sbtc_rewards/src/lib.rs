use anchor_lang::prelude::*;

declare_id!("9jEs9Sy93JMhY8VsVA7Z5TPA6Mi6eRWVBMWMcqppr1Ss");

#[program]
pub mod pdas {
    use super::*;

    pub fn create_ledger(
        ctx: Context<CreateLedger>,
    ) -> Result<()> {
        let ledger_account = &mut ctx.accounts.ledger_account;
        ledger_account.balance = 0;
        ledger_account.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn modify_ledger(
        ctx: Context<ModifyLedger>,
        new_balance: u32,
    ) -> Result<()> {
        let ledger_account = &mut ctx.accounts.ledger_account;
        ledger_account.balance = new_balance;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateLedger<'info> {
    #[account(
    init,
    payer = wallet,
    space = 104,
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

#[account]
pub struct Ledger {
    pub balance: u32,
    pub timestamp: i64, // Add the timestamp field
}
