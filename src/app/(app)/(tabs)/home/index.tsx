import React from "react";
import { getCurrentBrand } from "@/core/config/BrandConfig.js";

// Import brand-specific home pages
import AkilaJewellersHomePage from "@/brands/akilajewellers/pages/HomePage";
import DCJewellersHomePage from "@/brands/dc-jewellers/pages/HomePage";
import SrimuruganGoldhouseHomePage from "@/brands/srimurugangoldhouse/pages/HomePage";
import DemoJewellersHomePage from "@/brands/demo-jewellers/pages/HomePage";
import SrimuruganHomePage from "@/brands/srimurugan/pages/HomePage";

// Default home page (fallback)
import DefaultHome from "@/components/BrandedHomePage";

export default function Home() {
  const currentBrand = getCurrentBrand();

  // Brand-specific home page mapping
  const getBrandHomePage = () => {
    switch (currentBrand) {
      case 'akilajewellers':
        return <AkilaJewellersHomePage />;
      case 'dc-jewellers':
        return <DCJewellersHomePage />;
      case 'srimurugangoldhouse':
        return <SrimuruganGoldhouseHomePage />;
      case 'demo-jewellers':
        return <DemoJewellersHomePage />;
      case 'srimurugan':
        return <SrimuruganHomePage />;
      default:
        return <DefaultHome />;
    }
  };

  return getBrandHomePage();
} 