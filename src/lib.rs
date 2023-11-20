pub mod instruction;
pub mod state;
pub mod processor;

use crate::instruction::{parse_instruction, FundInstruction};
use crate::processor::{get_lock_info, lock_funds, unlock_funds};
use solana_program::{account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey};

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = parse_instruction(instruction_data)?;

    match instruction {
        FundInstruction::LockFunds { amount } => lock_funds(accounts, amount),
        FundInstruction::UnlockFunds => unlock_funds(accounts),
        FundInstruction::GetLockInfo => {
            let lock_info = get_lock_info(accounts)?;
            Ok(())
        }
    }
}