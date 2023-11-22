use anchor_lang::prelude::*;
use anchor_spl::token::Transfer;
use std::str::FromStr;
use anchor_spl::token;

declare_id!("Eerg1jbAvTdsRWvbbsAJGzGE25ByGQeJjyVHosHn6bKu");

#[program]
pub mod pdas {

    use super::*;

    pub fn create_lock_data(
        ctx: Context<CreateLockData>
    ) -> Result<()> {
        let lock_data_account = &mut ctx.accounts.lock_data_account;
        lock_data_account.address = *ctx.accounts.wallet.key;
        lock_data_account.initial_timestamp = Clock::get()?.unix_timestamp as u64;
        lock_data_account.amount_locked = 0;

        Ok(())
    }

    pub fn modify_lock_data(
        ctx: Context<ModifyLockData>,
        new_amount: u32,
    ) -> Result<()> {
        let lock_data_account = &mut ctx.accounts.lock_data_account;
        let old_amount = lock_data_account.amount_locked;
        lock_data_account.amount_locked = new_amount;

        // Calculate the difference between new and old amounts
        let amount_diff = new_amount as i64 - old_amount as i64;

        // Update the global state based on the amount difference
        let global_state = &mut ctx.accounts.global_state;
        global_state.total_locked = (global_state.total_locked as i64 + amount_diff) as u64;

        Ok(())
    }



    // pub fn distribute_rewards(ctx: Context<DistributeRewards>) -> Result<()> {
    //
    //     // Your public key
    //     let my_public_key = Pubkey::from_str("YourPublicKeyHere").unwrap();
    //
    //     // Check if the signer is your public key
    //     if *ctx.accounts.authority.key != my_public_key {
    //         return Err(ErrorCode::Unauthorized.into());
    //     }
    //
    //
    //     let clock = &ctx.accounts.clock;
    //     let current_timestamp = clock.unix_timestamp;
    //     let distribution_timestamp = 1705874756; // Define your distribution timestamp
    //
    //     // Check if the current time is past the distribution timestamp
    //     if current_timestamp < distribution_timestamp {
    //         return Err(ErrorCode::DistributionTimeNotReached.into());
    //     }
    //
    //     // Calculate the reward amount per user
    //     // This is a simplified calculation. Adjust according to your program's logic.
    //     let total_rewards = ctx.accounts.rewards_wallet.amount;
    //     let total_eligible_users = 1; // Calculate the total number of eligible users
    //     let reward_per_user = total_rewards / total_eligible_users;
    //
    //     // Ensure that rewards wallet has enough balance
    //     if total_rewards < reward_per_user * total_eligible_users {
    //         return Err(ErrorCode::InsufficientRewardsBalance.into());
    //     }
    //
    //     // Transfer rewards to the user
    //     let cpi_accounts = Transfer {
    //         from: ctx.accounts.rewards_wallet.to_account_info(),
    //         to: ctx.accounts.user_wallet.to_account_info(),
    //         authority: ctx.accounts.rewards_wallet.to_account_info(),
    //     };
    //     let cpi_program = ctx.accounts.token_program.to_account_info();
    //     let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    //     token::transfer(cpi_context, reward_per_user)?;
    //
    //     // Update global state and lock data as necessary
    //
    //     Ok(())
    // }
}

#[derive(Accounts)]
pub struct CreateLockData<'info> {
    #[account(
    init,
    payer = wallet,
    space = 48, // Adjusted space
    seeds = [wallet.key().as_ref(), b"_"],
    bump
    )]
    pub lock_data_account: Account<'info, LockInfo>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyLockData<'info> {
    #[account(mut)]
    pub lock_data_account: Account<'info, LockInfo>,
    #[account(mut)]
    pub wallet: Signer<'info>,

    // Include the global state account here
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
}


#[account]
pub struct LockInfo {
    pub address: Pubkey,
    pub initial_timestamp: u64,
    pub amount_locked: u32,
}

#[account]
pub struct GlobalState {
    pub total_locked: u64,
}


#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("The distribution time has not been reached yet.")]
    DistributionTimeNotReached,
    #[msg("Insufficient balance in rewards wallet for distribution.")]
    InsufficientRewardsBalance,
    // ... potentially other errors ...
}

