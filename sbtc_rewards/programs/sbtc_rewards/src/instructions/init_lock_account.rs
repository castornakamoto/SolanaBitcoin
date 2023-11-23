use anchor_lang::prelude::*;
use crate::state::ledger::Ledger;


#[derive(Accounts)]
pub struct InitLockAccount<'info> {
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

pub fn handler(ctx: Context<InitLockAccount>) -> Result<()> {
    let ledger_account = &mut ctx.accounts.ledger_account;

    //Initialize the ledger account and first element of the locks vector
    ledger_account.locks = Vec::new();

    Ok(())
}

