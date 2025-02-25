import axios from "axios";
import { GeotabSession } from "./geotab";
// import jwt from "jsonwebtoken";

// function decodeBase64Url(base64Url: string): string {
//     // Replace non-url compatible chars with base64 standard chars
//     base64Url = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     // Pad with trailing '='
//     const pad = base64Url.length % 4;
//     if (pad) {
//       base64Url += new Array(5 - pad).join('=');
//     }
//     return atob(base64Url);
//   }
  
//   function parseJwt(token: string): { header: any; payload: any; signature: string } | null {
//     const parts = token.split('.');
//     if (parts.length !== 3) {
//     throw new Error('JWT must have 3 parts');
//     }

//     const header = JSON.parse(decodeBase64Url(parts[0]));
//     const payload = JSON.parse(decodeBase64Url(parts[1]));
//     const signature = parts[2];

//     return { header, payload, signature };
//   }

export function isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) {
    //   console.log("No token stored...") 
      return false;
    }
 
    return true;
    // try {
    // //   const decodedToken: any = jwt.decode(token);
    //     const decodedToken = parseJwt(token)
    //     const currentTime = Math.floor(Date.now() / 1000);
 
    //   // Check if the token is expired
    //   if (decodedToken?.payload.exp < currentTime) {
    //     console.log("Token is expired...")
    //     return false;
    //   }

    //   console.log("Valid token...")
    //   return true;
    // } catch (error) {
    //   console.error("Invalid token:", error);
    //   return false;
    // }
  }

export function logout(): void {
  localStorage.removeItem('authToken');
}

const access_api = axios.create({
  baseURL: import.meta.env.VITE_ACCESS_API_URL,
  headers: {
      'Content-Type': 'application/json',
  },
});

export async function geotab_sso_login({ userName, database, sessionId }: GeotabSession): Promise<boolean> {
    try {
        const response = await access_api.post('/access/geotab/sso',
            {
                username: userName,
                database: database,
                sessionId: sessionId
            }
        );

        if (response.status === 200 && response.data.token) {
            // const authHeader = `Bearer ${response.data.token}`;
            // localStorage.setItem('authToken', authHeader);
            localStorage.setItem('authToken', response.data.token)
            return true;
        }

        return false;
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
}

const oauth2_api = axios.create({
  baseURL: import.meta.env.VITE_OAUTH2_API_URL,
  headers: {
      "Content-Type": "application/x-www-form-urlencoded",
  },
});

export async function linklabs_oauth2_login(username: string, password: string): Promise<boolean> {
  const body = new URLSearchParams({
    grant_type: "password",
    username: username,
    password: password,
    client_id: import.meta.env.VITE_OAUTH2_CLIENT_ID,
    client_secret: import.meta.env.VITE_OAUTH2_CLIENT_SECRET,
  });

  try {
    const response = await oauth2_api.post("oauth/token", body.toString());
    const { access_token } = response.data;

    if (access_token) {
      localStorage.setItem("authToken", access_token);
      return true;
    }
    return false;
  } catch (error) {
    console.error("OAuth2 authentication failed:", error);
    return false;
  }
}

export function getAuthHeader(): string {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return "";
    }
    return `Bearer ${token}`;
}
