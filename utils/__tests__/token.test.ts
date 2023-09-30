import { advanceTo } from "jest-date-mock";
import { createSessionToken, verifySessionToken } from "../token";

beforeEach(() => {
  advanceTo(1674974716841);
});

test("generate session token", async () => {
  const result = createSessionToken(
    {
      id: "session-test-id",
      nonce: "abcdef",
      userId: "test-user-id",
    },
    60,
    "callback-test"
  );
  await expect(result).resolves.toMatch(
    /^eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9\.eyJzZXNzaW9uIjp7ImlkIjoic2Vzc2lvbi10ZXN0LWlkIiwibm9uY2UiOiJhYmNkZWYiLCJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQifSwiY2FsbGJhY2siOiJjYWxsYmFjay10ZXN0IiwiaWF0IjoxNjc0OTc0NzE2LCJleHAiOjE2NzQ5NzQ3NzZ9\./
  );
});

test("verify session token: ok", async () => {
  const token =
    "eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uIjp7ImlkIjoic2Vzc2lvbi10ZXN0LWlkIiwibm9uY2UiOiJhYmNkZWYiLCJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQifSwiY2FsbGJhY2siOiJjYWxsYmFjay10ZXN0IiwiaWF0IjoxNjc0OTc0NzE2LCJleHAiOjE2NzQ5NzQ3NzZ9.AJ9OrxZovUjVhOtUIQUCEykCfP-aoIBJw61nK91_MGVnup6ei7ttVuQpVNAzr2lBPzegLALoKRLETNyNnBd7zv0JAWAgS0z8NLqHlSF6Eqfs8dufph5yfzuFQ7eFKI2kScIY62Ab4KN8j7V7j-U2edL-fB5UJiRpB6pkGnp2IepNt251";
  const result = verifySessionToken(token);
  await expect(result).resolves.toEqual({
    exp: 1674974776,
    iat: 1674974716,
    session: {
      id: "session-test-id",
      nonce: "abcdef",
      userId: "test-user-id",
    },
    callback: "callback-test",
  });
});

test("verify session token: ng: invalid alg", async () => {
  const token =
    "eyJ0eXAiOiJub25lIiwiYWxnIjoiSFMyNTYifQo.eyJ1c2VyIjp7ImlkIjoidGVzdC11c2VyLWlkIiwidXNlcm5hbWUiOiJ0ZXN0LXVzZXItbmFtZSIsImRpc2NyaW1pbmF0b3IiOiIwMTIzIiwiYXZhdGFyVXJsIjoidGVzdC1hdmF0YXItdXJsIn0sImlhdCI6MTY3NDk3NDcxNiwiZXhwIjoxNjc0OTc0Nzc2fQ";
  await expect(verifySessionToken(token)).rejects.toThrowError(
    "Invalid Compact JWS"
  );
});

test("verify token: ng: expired", async () => {
  advanceTo(1674974716841 + 1000 * 60 * 60);
  const token =
    "eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoidGVzdC11c2VyLWlkIiwidXNlcm5hbWUiOiJ0ZXN0LXVzZXItbmFtZSIsImRpc2NyaW1pbmF0b3IiOiIwMTIzIiwiYXZhdGFyVXJsIjoidGVzdC1hdmF0YXItdXJsIn0sImlhdCI6MTY3NDk3NDcxNiwiZXhwIjoxNjc0OTc0Nzc2fQ.AfN3srZMXX6Rxi8bLMxDJ-vbeHEmDiLKnaMaQEHdzFWVdAulHTBJYltW9DU9SgxiXaUNsVeT-BDLhl9h4wAB3SeIAa5ytGcIk35HDyjqoNsWrdx8qw8YarOkYSUGc6DTG0SjakEju85ntM0l096NRdfPAAqUOQ1GGyE8EatQ-EmFQjLh";
  await expect(verifySessionToken(token)).rejects.toThrowError(
    '"exp" claim timestamp check failed'
  );
});
