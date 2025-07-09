import React from 'react';
import TawkMessengerReact from '@tawk.to/tawk-messenger-react';

const TawkChat = () => {
  const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID;
  const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID;

  if (!propertyId || !widgetId) {
    // Do not render the chat widget if env vars are missing
    return null;
  }

  return <TawkMessengerReact propertyId={propertyId} widgetId={widgetId} />;
};

export default TawkChat;
