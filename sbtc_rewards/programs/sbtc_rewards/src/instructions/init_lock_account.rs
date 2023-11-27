use anchor_lang::prelude::*;
use crate::state::lock_account::LockAccount;


#[derive(Accounts)]
pub struct InitLockAccount<'info> {
    #[account(
    init,
    payer = wallet,
    space = 8 + 640,
    seeds = [wallet.key().as_ref(), b"_"],
    bump
    )]
    pub lock_account: Account<'info, LockAccount>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitLockAccount>) -> Result<()> {
    let lock_account = &mut ctx.accounts.lock_account;

    //Initialize the lock account and first element of the locks vector
    lock_account.locks = Vec::new();

    Ok(())
}

