use anchor_lang::prelude::*;

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct LockEntry {
    pub amount: u64,
    pub timestamp: i64,
}