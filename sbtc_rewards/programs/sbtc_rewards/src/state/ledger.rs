use anchor_lang::prelude::*;
use crate::state::token_lock::TokenLock;

#[account]
pub struct Ledger {
    pub locks: Vec<TokenLock>,
}