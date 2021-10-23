import { api } from "../services/api";
import { createContext, ReactNode, useEffect, useState } from "react";

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

type AuthProviderProps = {
  children: ReactNode;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props: AuthProviderProps) {
  const [loggedUser, setLoggedUser] = useState<User | null>(null);

  const signInUrl = 'https://github.com/login/oauth/authorize?scope=user&client_id=2ea219f769bd96bb7c98';

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>('authenticate', {
      code: githubCode,
    });

    const { token, user } = response.data;

    setLoggedUser(user);
    localStorage.setItem('@dowhile:token', token);

    api.defaults.headers.common.authorization = `Bearer ${token}`;
  }

  function signOut() {
    setLoggedUser(null);
    localStorage.removeItem('@dowhile:token');
  }

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=');
      window.history.pushState({}, '', urlWithoutCode);
      signIn(githubCode);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token');

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;

      api.get<User>('user').then(response => {
        setLoggedUser(response.data);
      });
    }
  }, []);
  
  return (
    <AuthContext.Provider value={{signInUrl, user: loggedUser, signOut}}>
      {props.children}
    </AuthContext.Provider>
  )
}