import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import { useAsync } from "@/hooks/useAsync";
import { fail } from "@/utils/functions";
import { createContext, ReactNode, useMemo, useState } from "react";
import { User } from "@/types/model";
import { UserAPI } from "@/utils/api";

interface AuthContext {
  pending: boolean;
  user?: User | null;
  refresh(): Promise<User | null>;
}

const AuthContext = createContext<AuthContext>({
  pending: true,
  refresh: fail("Use AuthContextProvider"),
});
export default AuthContext;

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null | undefined>(initialUser);

  const { pending: pendingGetMe, call: refresh } =
    useAsyncCallback(async () => {
      const { user } = await UserAPI.getMe().catch(() => ({ user: null }));
      setUser(user);
      return user;
    }, []);

  useAsync(async () => {
    if (user) {
      return;
    }
    await refresh();
  }, [refresh, user]);

  const value = useMemo(
    () => ({
      pending: user === undefined || pendingGetMe,
      user,
      refresh,
    }),
    [pendingGetMe, refresh, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
