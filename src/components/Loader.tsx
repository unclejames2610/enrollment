import React from "react";
import { SyncLoader } from "react-spinners";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <SyncLoader color="#2F3850" size={12} />
    </div>
  );
};

export default Loader;
