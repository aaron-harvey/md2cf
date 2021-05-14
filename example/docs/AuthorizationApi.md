---
title: Authorization API
tags:
  - api
  - strata
  - strata portal
---
!!! include extra/style.css.md !!!

!!! warning ""
    All endpoints require a bearer token generated via the login endpoint

## Authorization Token

!!! example ""
    `POST /api/v1/auth/login`

## Request

The request body expects the following interface:

!!! example Request Body
    ```javascript {linenumbers=false}
    Interface LoginRequest {
      id: string;
      apiKey: string;
      timeout: number;
    }
    ```

!!! example Example Request
    ```bash {linenumbers=false}
    curl --location --request POST \
      'https://dev-portal.strata.onsemi.com/api/v1/auth/login' \
      --header 'Content-Type: application/json' \
      --data-raw '{
      "id": "service-account-name",
      "apiKey": "very-random-password"
    }'
    ```

## Response

The response body will match one of the following type interfaces:

!!! success 200 OK
    ```javascript {linenumbers=false}
    Interface AuthResponse {
      access_token: string;
      token_type: string;
    }
    ```
!!! error 400-500 Error
    ```javascript {linenumbers=false}
    Interface ErrorResponse {
      statusCode: number;
      message: string;
    }
    ```

