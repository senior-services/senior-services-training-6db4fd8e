/**
 * Test component to verify thumbnail loading is working correctly
 * This is for debugging purposes and can be removed after verification
 */

import React from 'react';

export const ThumbnailTest = () => {
  const testThumbnails = [
    {
      title: "YouTube HQ Default (should work)",
      url: "https://img.youtube.com/vi/ZF8wZuZoUf8/hqdefault.jpg"
    },
    {
      title: "YouTube Max Res (might not exist)", 
      url: "https://img.youtube.com/vi/ZF8wZuZoUf8/maxresdefault.jpg"
    },
    {
      title: "YouTube Default (always works)",
      url: "https://img.youtube.com/vi/ZF8wZuZoUf8/default.jpg"
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-bold">Thumbnail Loading Test</h3>
      {testThumbnails.map((test, index) => (
        <div key={index} className="border p-4 rounded">
          <h4 className="font-medium mb-2">{test.title}</h4>
          <img 
            src={test.url}
            alt={test.title}
            className="w-48 h-auto border"
            onLoad={() => console.log(`✅ Loaded: ${test.title}`)}
            onError={() => console.log(`❌ Failed: ${test.title}`)}
          />
          <p className="text-body-sm text-muted-foreground mt-2">{test.url}</p>
        </div>
      ))}
    </div>
  );
};