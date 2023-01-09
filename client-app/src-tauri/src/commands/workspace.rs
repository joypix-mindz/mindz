use ipc_types::workspace::{
  CreateWorkspace, CreateWorkspaceResult, GetWorkspacesResult, UpdateWorkspace,
};
use jwst::{DocStorage, Workspace as OctoBaseWorkspace};
use lib0::any::Any;

use crate::state::AppState;

#[tauri::command]
/// create yDoc for a workspace
pub async fn get_workspaces<'s>(
  state: tauri::State<'s, AppState>,
  parameters: CreateWorkspace,
) -> Result<GetWorkspacesResult, String> {
  match &state
    .0
    .lock()
    .await
    .metadata_db
    .get_user_workspaces(parameters.user_id)
    .await
  {
    Ok(user_workspaces) => Ok(GetWorkspacesResult {
      workspaces: user_workspaces.clone(),
    }),
    Err(error_message) => Err(error_message.to_string()),
  }
}

#[tauri::command]
/// create yDoc for a workspace
pub async fn create_workspace<'s>(
  state: tauri::State<'s, AppState>,
  parameters: CreateWorkspace,
) -> Result<CreateWorkspaceResult, String> {
  match &state
    .0
    .lock()
    .await
    .metadata_db
    .create_normal_workspace(parameters.user_id)
    .await
  {
    Ok(new_workspace) => {
      let workspace_doc = OctoBaseWorkspace::new(new_workspace.id.clone());

      workspace_doc.with_trx(|mut workspace_doc_transaction| {
        workspace_doc_transaction.set_metadata(
          "name",
          Any::String(parameters.name.clone().into_boxed_str()),
        );
      });
      if let Err(error_message) = &state
        .0
        .lock()
        .await
        .doc_storage
        .write_doc(new_workspace.id.clone(), workspace_doc.doc())
        .await
      {
        Err(error_message.to_string())
      } else {
        Ok(CreateWorkspaceResult {
          id: new_workspace.id.clone(),
          name: parameters.name,
        })
      }
    }
    Err(error_message) => Err(error_message.to_string()),
  }
}

#[tauri::command]
pub async fn update_workspace<'s>(
  state: tauri::State<'s, AppState>,
  parameters: UpdateWorkspace,
) -> Result<bool, String> {
  // TODO: check user permission
  // No thing to update now. The avatar is update in YDoc using websocket or yrs.update
  Ok(true)
}
