import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (isMounted) {
            setSession(null);
            setHasAccess(false);
            setLoading(false);
          }
          return;
        }

        if (!isMounted) return;
        setSession(session);
        
        if (session) {
          // Verify user has any allowed role
          const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          if (rolesError) {
            console.error("Roles error:", rolesError);
            if (isMounted) {
              setHasAccess(false);
              setLoading(false);
            }
            return;
          }

          const isAuthorized = roles?.some(
            (r) => r.role === "admin" || r.role === "sales" || r.role === "viewer" || 
                   r.role === "direcao" || r.role === "gerencia" || r.role === "gestor" ||
                   r.role === "sdr" || r.role === "vendedor"
          );

          if (isMounted) {
            setHasAccess(isAuthorized || false);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) {
          setSession(null);
          setHasAccess(false);
          setLoading(false);
        }
      }
    };

    checkAccess();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      
      setSession(session);
      
      if (session) {
        try {
          const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          if (rolesError) {
            console.error("Roles error on auth change:", rolesError);
            setHasAccess(false);
            return;
          }

          const isAuthorized = roles?.some(
            (r) => r.role === "admin" || r.role === "sales" || r.role === "viewer" ||
                   r.role === "direcao" || r.role === "gerencia" || r.role === "gestor" ||
                   r.role === "sdr" || r.role === "vendedor"
          );

          setHasAccess(isAuthorized || false);
        } catch (error) {
          console.error("Auth change error:", error);
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session || !hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
