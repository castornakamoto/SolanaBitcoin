use solana_program::program_error::ProgramError;
use solana_program::pubkey::Pubkey;
use std::convert::TryInto;

#[derive(Clone, Debug)]
pub(crate) struct LockInfo {
    pub(crate) address: Pubkey,
    pub(crate) initial_timestamp: u64,
    pub(crate) end_timestamp: u64,
    pub(crate) amount_locked: u64,
}

impl LockInfo {
    pub fn serialize(&self) -> Result<Vec<u8>, ProgramError> {
        let mut data = Vec::with_capacity(32); // Adjust the capacity as needed
        data.extend_from_slice(&self.address.to_bytes());
        data.extend_from_slice(&self.initial_timestamp.to_le_bytes());
        data.extend_from_slice(&self.end_timestamp.to_le_bytes());
        data.extend_from_slice(&self.amount_locked.to_le_bytes());
        Ok(data)
    }

    pub fn deserialize(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() < 32 {
            return Err(ProgramError::InvalidAccountData);
        }

        let address_bytes: [u8; 32] = data[..32].try_into().map_err(|_| ProgramError::InvalidAccountData)?;
        let address = Pubkey::new_from_array(address_bytes);
        let initial_timestamp = u64::from_le_bytes(data[32..40].try_into().map_err(|_| ProgramError::InvalidAccountData)?);
        let end_timestamp = u64::from_le_bytes(data[40..48].try_into().map_err(|_| ProgramError::InvalidAccountData)?);
        let amount_locked = u64::from_le_bytes(data[48..56].try_into().map_err(|_| ProgramError::InvalidAccountData)?);

        Ok(LockInfo {
            address,
            initial_timestamp,
            end_timestamp,
            amount_locked,
        })
    }
}
