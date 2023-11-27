use anchor_lang::prelude::*;
use crate::state::lock_entry::LockEntry;

#[account]
pub struct LockAccount {
    pub locks: Vec<LockEntry>,
}