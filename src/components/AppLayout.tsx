import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
