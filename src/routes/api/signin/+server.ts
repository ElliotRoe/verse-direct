import { adminAuth } from "$lib/server/admin";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { idToken, anonymous } = await request.json();

  if (!idToken) {
    throw error(400, "ID token is required");
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);

    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      const options = {
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        path: "/",
      };

      cookies.set("__session", cookie, options);

      await adminAuth.setCustomUserClaims(decodedIdToken.uid, { anonymous });

      return json({ status: "signedIn" });
    } else {
      throw error(401, "Recent sign in required!");
    }
  } catch (e) {
    console.error("Error creating session:", e);
    throw error(401, "Invalid authentication");
  }
};

export const DELETE: RequestHandler = async ({ cookies }) => {
  cookies.delete("__session", { path: "/" });
  return json({ status: "signedOut" });
};
