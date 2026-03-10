/**
 * Microsoft OAuth Callback Page
 * URL: /auth/microsoft/callback
 *
 * This page handles the redirect from Microsoft after the user grants permission.
 * It exchanges the auth code for tokens via the Edge Function, then closes the popup
 * (or redirects to /emails if opened in same tab).
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const MicrosoftCallback = () => {
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        if (!code) {
          throw new Error('No authorization code received from Microsoft.');
        }

        // Get current Supabase user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('You must be logged in to connect Outlook.');

        const userId = session.user.id;

        // Exchange code for tokens via Edge Function
        const { data, error: fnError } = await supabase.functions.invoke('microsoft-oauth', {
          body: { action: 'exchange', code, user_id: userId },
        });

        if (fnError || data?.error) throw new Error(data?.error || fnError?.message || 'Token exchange failed');

        setStatus('success');

        // Notify parent window if opened as popup, then close
        if (window.opener) {
          window.opener.postMessage({ type: 'MICROSOFT_OAUTH_SUCCESS', ms_email: data.ms_email }, '*');
          setTimeout(() => window.close(), 1000);
        } else {
          // Not a popup — redirect to emails page
          setTimeout(() => { window.location.href = '/emails'; }, 1500);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Authentication failed.');
        setStatus('error');

        if (window.opener) {
          window.opener.postMessage({ type: 'MICROSOFT_OAUTH_ERROR', error: err.message }, '*');
          setTimeout(() => window.close(), 3000);
        }
      }
    };

    handle();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        {status === 'processing' && (
          <>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Connecting Outlook...</h2>
            <p className="text-sm text-gray-500">Exchanging tokens with Microsoft</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Outlook Connected!</h2>
            <p className="text-sm text-gray-500">Closing window...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Connection Failed</h2>
            <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MicrosoftCallback;
