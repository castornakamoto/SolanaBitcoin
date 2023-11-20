use solana_program::program_error::ProgramError;

pub(crate) enum FundInstruction {
    LockFunds { amount: u64 },
    UnlockFunds,
    GetLockInfo,
}

pub(crate) fn parse_instruction(data: &[u8]) -> Result<FundInstruction, ProgramError> {
    if data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    match data[0] {
        0x01 => parse_lock_funds(&data[1..]),
        0x02 => Ok(FundInstruction::UnlockFunds),
        0x03 => Ok(FundInstruction::GetLockInfo),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn parse_lock_funds(data: &[u8]) -> Result<FundInstruction, ProgramError> {
    if data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let amount = u64::from_le_bytes(data[0..8].try_into().map_err(|_| ProgramError::InvalidInstructionData)?);
    Ok(FundInstruction::LockFunds { amount })
}