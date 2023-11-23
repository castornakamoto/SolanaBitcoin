use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
mod errors;

use instructions::*;

declare_id!("9jEs9Sy93JMhY8VsVA7Z5TPA6Mi6eRWVBMWMcqppr1Ss");

#[program]
pub mod reward_system {
    use super::*;

    pub fn init_lock_account(
        ctx: Context<InitLockAccount>,
    ) -> Result<()> {
        instructions::init_lock_account::handler(ctx)
    }

    pub fn lock_tokens(
        ctx: Context<LockTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::lock_tokens::handler(ctx, amount)
    }

    pub fn unlock_tokens(
        ctx: Context<UnlockTokens>,
        amount: u64,
        lock_index: u64,
    ) -> Result<()> {
        instructions::unlock_tokens::handler(ctx, amount, lock_index)
    }
}





