import { GetServerSideProps, PreviewData } from "next";
import { ParsedUrlQuery } from "querystring";
import { verifySessionUser } from "../api-server/with-user";
import { UserModel } from "@/models";

export function userServerSideProps<
  P extends { [key: string]: any } = { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData,
  R extends "guest" | "user" | "admin" = "guest" | "user" | "admin"
>(
  role: R,
  gssp: GetServerSideProps<
    P,
    Q & (R extends "guest" ? { me?: UserModel.User } : { me: UserModel.User }),
    D
  >
): GetServerSideProps<P, Q, D> {
  return async (context) => {
    const { session, user } = await verifySessionUser(context.req);
    const me = session ? user : undefined;
    if (role === "admin" && (!me || me.role !== "admin")) {
      return { notFound: true };
    }
    if (role === "user" && !me) {
      return { notFound: true };
    }

    const params = (context.params ?? {}) as Q &
      (R extends "guest" ? { me?: UserModel.User } : { me: UserModel.User });
    params["me"] = me;
    return gssp({ ...context, params });
  };
}
