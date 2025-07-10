import TawkMessengerReact from '@tawk.to/tawk-messenger-react';

const TawkChat = () => {
  const propertyIdRaw = import.meta.env.VITE_TAWK_PROPERTY_ID;
  const widgetIdRaw = import.meta.env.VITE_TAWK_WIDGET_ID;

  // If either is set to the empty string, treat as disabled
  if (propertyIdRaw === '' || widgetIdRaw === '') {
    return null;
  }

  // If not set, use defaults
  const propertyId = propertyIdRaw || '686e24bc128bdf190f98cbf8';
  const widgetId = widgetIdRaw || '1ivn3v0mt';

  return <TawkMessengerReact propertyId={propertyId} widgetId={widgetId} />;
};

export default TawkChat;
