use solana_program::account_info::{AccountInfo, next_account_info};
use solana_program::entrypoint::ProgramResult;
use solana_program::program_error::ProgramError;
use solana_program::system_instruction;
use crate::state::LockInfo;

pub(crate) fn lock_funds(accounts: &[AccountInfo], amount: u64) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_account = next_account_info(account_info_iter)?;
    let lock_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if **user_account.try_borrow_lamports()? < amount {
        return Err(ProgramError::InsufficientFunds);
    }

    let transfer_instruction = system_instruction::transfer(user_account.key, lock_account.key, amount);

    solana_program::program::invoke(
        &transfer_instruction,
        &[user_account.clone(), lock_account.clone(), system_program.clone()],
    )?;

    let new_lock_info = LockInfo {
        address: *user_account.key,
        initial_timestamp: 0,
        end_timestamp: 0,
        amount_locked: 0,
    };

    update_lock_info(lock_account, new_lock_info)?;

    Ok(())
}

pub(crate) fn unlock_funds(accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let lock_data_account = next_account_info(account_info_iter)?;
    let lock_account = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    let user_pubkey = user_account.key;

    let data = &mut lock_data_account.try_borrow_mut_data()?;
    let locked_amount = LockInfo::deserialize(data)?.amount_locked;
    let fee_amount = get_fees_earned();
    let total_amount = locked_amount + fee_amount;

    if **lock_account.try_borrow_lamports()? < total_amount {
        return Err(ProgramError::InsufficientFunds);
    }

    let transfer_instruction = system_instruction::transfer(lock_account.key, user_account.key, total_amount);

    solana_program::program::invoke(
        &transfer_instruction,
        &[lock_account.clone(), user_account.clone(), system_program.clone()],
    )?;

    let new_lock_info = LockInfo {
        address: *user_pubkey,
        initial_timestamp: 0,
        end_timestamp: 0,
        amount_locked: 0,
    };

    update_lock_info(lock_data_account, new_lock_info)?;

    Ok(())
}

pub(crate) fn get_lock_info(accounts: &[AccountInfo]) -> Result<Option<LockInfo>, ProgramError> {
    let account_info_iter = &mut accounts.iter();
    let lock_data_account = next_account_info(account_info_iter)?;
    let data = &lock_data_account.try_borrow_data()?;

    Ok(Some(LockInfo::deserialize(data)?))
}

fn update_lock_info(lock_data_account: &AccountInfo, new_lock_info: LockInfo) -> ProgramResult {
    let serialized = new_lock_info.serialize()?;
    let data = &mut lock_data_account.try_borrow_mut_data()?;
    data.copy_from_slice(&serialized);

    Ok(())
}

fn get_fees_earned() -> u64 {
    100_000_000
}
