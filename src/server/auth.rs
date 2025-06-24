use axum::{body::Body, http::Request, http::StatusCode, middleware::Next, response::Response};

/// Simple authentication middleware that expects an `X-Auth-Token` header.
/// The header value is inserted into request extensions for handlers to use.
pub async fn auth(mut req: Request<Body>, next: Next) -> Result<Response, StatusCode> {
    // Allow unauthenticated access to join_room so new users can register
    if req.uri().path() == "/api/join_room" {
        return Ok(next.run(req).await);
    }

    let token = req
        .headers()
        .get("x-auth-token")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    if let Some(token) = token {
        if !token.is_empty() {
            req.extensions_mut().insert(token);
            return Ok(next.run(req).await);
        }
    }

    Err(StatusCode::UNAUTHORIZED)
}
