import Image from "next/image";
import React from "react";

const ManageOrders = () => {
  return (
    <div className="bg-[#ECFDF5] mt-4 mb-4 m-3 p-4 rounded-lg shadow-gray-400 shadow-sm h-screen">
      <div className="flex items-center gap-2 mt-6 ml-2 mb-6">
        <Image
          src="/images/seller/Cart.png"
          alt="Product Image"
          width={35}
          height={35}
        />
        <h1 className="text-[#103C2E] font-bold text-3xl ml-1">
          Manage Orders
        </h1>
      </div>
    </div>
  );
};

export default ManageOrders;
