use anchor_lang::prelude::*;
use solana_program::program::invoke;
use solana_program::system_instruction;
use crate::state::ledger::Ledger;
use crate::state::token_lock::TokenLock;


#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub ledger_account: Account<'info, Ledger>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}


pub fn handler(ctx: Context<LockTokens>, amount: u64) -> Result<()> {

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

    // Create and add the new lock to the ledger
    ledger_account.locks.push(TokenLock {
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}