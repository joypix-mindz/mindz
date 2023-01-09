use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct PutBlob {
  pub workspace_id: Option<String>,
  pub blob: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct GetBlob {
  pub workspace_id: Option<String>,
  pub id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub enum IBlobParameters {
  Put(PutBlob),
  Get(GetBlob),
}
