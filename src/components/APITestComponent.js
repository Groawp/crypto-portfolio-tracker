import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Camera } from 'lucide-react';
import aiService from '../services/aiService';

const APITestComponent = () => {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [imageTest, setImageTest] = useState(null);

  const testAPI = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      // Test 1: Check configuration
      const isConfigured = aiService.isConfigured();
      
      // Test 2: Test connection
      const connectionTest = await aiService.testConnection();
      
      // Test 3: Simple chat test
      let chatTest = { success: false };
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiService.getApiKey()}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Say "API working"' }],
            max_tokens: 10
          })
        });
        
        chatTest = {
          success: response.ok,
          status: response.status,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        chatTest = { success: false, error: error.message };
      }
      
      setTestResults({
        configured: isConfigured,
        connection: connectionTest,
        chat: chatTest
      });
      
    } catch (error) {
      setTestResults({
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const testImageAnalysis = async () => {
    // Create a test image with text
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 200);
    
    // Add test transaction text
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Transaction:', 20, 40);
    ctx.fillText('Bought 0.5 BTC at $45,000', 20, 80);
    ctx.fillText('Total: $22,500', 20, 120);
    ctx.fillText('Date: ' + new Date().toLocaleDateString(), 20, 160);
    
    // Convert to base64
    const testImage = canvas.toDataURL('image/png');
    
    setImageTest({ testing: true });
    
    try {
      const result = await aiService.analyzeTransactionImage(testImage);
      setImageTest({
        success: true,
        transactions: result,
        imageUsed: testImage
      });
    } catch (error) {
      setImageTest({
        success: false,
        error: error.message,
        imageUsed: testImage
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">OpenAI API Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={testAPI}
          disabled={testing}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Testing API...</span>
            </>
          ) : (
            <span>Test API Connection</span>
          )}
        </button>

        {testResults && (
          <div className="space-y-3">
            {/* Configuration Test */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                {testResults.configured ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-white font-medium">API Key Configuration</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {testResults.configured ? 'API key is configured' : 'No API key found'}
              </p>
            </div>

            {/* Connection Test */}
            {testResults.connection && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  {testResults.connection.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-white font-medium">API Connection</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {testResults.connection.success 
                    ? `Connected! Vision access: ${testResults.connection.hasVisionAccess ? 'Yes' : 'No'}`
                    : testResults.connection.error}
                </p>
                {testResults.connection.models && (
                  <details className="mt-2">
                    <summary className="text-gray-500 text-xs cursor-pointer">Available models</summary>
                    <pre className="text-xs text-gray-600 mt-1 overflow-auto">
                      {testResults.connection.models.join('\n')}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Chat Test */}
            {testResults.chat && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  {testResults.chat.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-white font-medium">Chat API Test</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {testResults.chat.success 
                    ? 'Chat API is working correctly'
                    : `Failed: ${testResults.chat.error || 'Unknown error'}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Image Analysis Test */}
        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={testImageAnalysis}
            disabled={imageTest?.testing}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {imageTest?.testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Testing Vision API...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>Test Image Analysis</span>
              </>
            )}
          </button>

          {imageTest && !imageTest.testing && (
            <div className="mt-4 bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {imageTest.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-white font-medium">Vision API Test</span>
              </div>
              
              {imageTest.success ? (
                <div>
                  <p className="text-gray-400 text-sm">
                    Successfully extracted {imageTest.transactions.length} transaction(s)
                  </p>
                  {imageTest.transactions.map((tx, i) => (
                    <div key={i} className="mt-2 text-xs text-gray-500">
                      {tx.type} {tx.amount} {tx.assetSymbol} at ${tx.price}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-400 text-sm">{imageTest.error}</p>
              )}
              
              {imageTest.imageUsed && (
                <details className="mt-2">
                  <summary className="text-gray-500 text-xs cursor-pointer">Test image used</summary>
                  <img src={imageTest.imageUsed} alt="Test" className="mt-2 border border-gray-600 rounded" />
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Common Issues */}
      <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">Common Issues:</h3>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• "Invalid API Key" - Check your key in OpenAI dashboard</li>
          <li>• "Model not found" - Your key may not have GPT-4 Vision access</li>
          <li>• "Rate limit" - Wait a few seconds and try again</li>
          <li>• "Insufficient quota" - Add credits to your OpenAI account</li>
        </ul>
      </div>
    </div>
  );
};

export default APITestComponent;