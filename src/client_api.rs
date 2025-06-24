#[cfg(not(feature = "ssr"))]
use crate::types::JoinResponse;
#[cfg(not(feature = "ssr"))]
use leptos::ServerFnError;
#[cfg(not(feature = "ssr"))]
use gloo_net::http::Request;
#[cfg(not(feature = "ssr"))]
use serde_json::json;

#[cfg(not(feature = "ssr"))]
pub async fn join_room(username: String) -> Result<JoinResponse, ServerFnError<()>> {
    let body = json!({ "username": username });
    let resp = Request::post("/api/join_room")
        .header("Content-Type", "application/json")
        .body(body.to_string()).map_err(|e| ServerFnError::<()>::Request(e.to_string()))?
        .send()
        .await
        .map_err(|e| ServerFnError::<()>::Request(e.to_string()))?;
    let data: JoinResponse = resp
        .json()
        .await
        .map_err(|e| ServerFnError::<()>::Deserialization(e.to_string()))?;
    Ok(data)
}
