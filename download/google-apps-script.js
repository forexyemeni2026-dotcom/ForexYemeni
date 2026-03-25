/**
 * Google Apps Script للتكامل مع TradingView و ForexYemeni
 * 
 * طريقة الإعداد:
 * 1. افتح Google Apps Script: https://script.google.com
 * 2. أنشئ مشروع جديد
 * 3. انسخ هذا الكود بالكامل
 * 4. عدّل المتغيرات أدناه حسب إعداداتك
 * 5. انشر كتطبيق ويب (Deploy as web app)
 */

// ============== الإعدادات ==============

// رابط التطبيق المنشور على Vercel
const APP_URL = 'https://your-app.vercel.app';

// مفتاح API (يجب أن يطابق المفتاح في ملف /api/integration/tradingview/route.ts)
const API_KEY = 'forex-yemeni-webhook-2026';

// ============== الدوال الرئيسية ==============

/**
 * معالجة طلبات Webhook من TradingView
 * يتم استدعاؤها عند إرسال تنبيه من TradingView
 */
function doPost(e) {
  try {
    // تسجيل الطلب للمراجعة
    logRequest(e);
    
    // تحليل البيانات المستلمة
    const data = parseTradingViewData(e);
    
    if (!data) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'فشل تحليل البيانات'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إرسال التوصية للتطبيق
    const result = sendRecommendation(data);
    
    // إرسال إشعار للتيليجرام (اختياري)
    if (result.success) {
      sendTelegramNotification(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * معالجة طلبات GET للتأكد من عمل السكربت
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'ForexYemeni TradingView Webhook is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * تحليل البيانات من TradingView
 */
function parseTradingViewData(e) {
  try {
    // TradingView قد يرسل البيانات بعدة أشكال
    let data = {};
    
    if (e.postData && e.postData.contents) {
      // محاولة تحليل JSON
      try {
        data = JSON.parse(e.postData.contents);
      } catch {
        // إذا فشل، قد تكون بيانات نموذج
        const params = e.postData.contents.split('&');
        params.forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            data[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }
    } else if (e.parameter) {
      // بيانات من نموذج عادي
      data = e.parameter;
    }
    
    // تحويل أسماء الحقول من TradingView
    return {
      symbol: data.symbol || data.ticker || data.s,
      action: data.action || data.side || data.order || 'buy',
      price: parseFloat(data.price || data.close || data.p || 0),
      stopLoss: parseFloat(data.stopLoss || data.sl || data.stop_loss || 0) || null,
      takeProfit: parseFloat(data.takeProfit || data.tp || data.take_profit || 0) || null,
      timeframe: data.timeframe || data.tf || data.interval || null,
      notes: data.notes || data.note || data.message || 'توصية من TradingView'
    };
    
  } catch (error) {
    console.error('Error parsing data:', error);
    return null;
  }
}

/**
 * إرسال التوصية للتطبيق
 */
function sendRecommendation(data) {
  try {
    const url = `${APP_URL}/api/integration/tradingview`;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Response code:', responseCode);
    console.log('Response:', responseText);
    
    if (responseCode === 200 || responseCode === 201) {
      return {
        success: true,
        message: 'تم إرسال التوصية بنجاح',
        data: JSON.parse(responseText)
      };
    } else {
      return {
        success: false,
        error: `خطأ في الإرسال: ${responseCode}`,
        details: responseText
      };
    }
    
  } catch (error) {
    console.error('Error sending recommendation:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * تسجيل الطلبات للمراجعة
 */
function logRequest(e) {
  const sheet = getOrCreateLogSheet();
  const timestamp = new Date();
  
  const rowData = [
    timestamp,
    e.postData ? e.postData.contents : 'No post data',
    e.parameter ? JSON.stringify(e.parameter) : 'No parameters'
  ];
  
  sheet.appendRow(rowData);
}

/**
 * الحصول على ورقة التسجيل أو إنشاؤها
 */
function getOrCreateLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Webhook Logs');
  
  if (!sheet) {
    sheet = ss.insertSheet('Webhook Logs');
    sheet.appendRow(['التاريخ', 'Post Data', 'Parameters']);
  }
  
  return sheet;
}

// ============== إشعارات التيليجرام (اختياري) ==============

// توكن بوت التيليجرام (اختياري)
const TELEGRAM_BOT_TOKEN = ''; // أدخل توكن البوت هنا
const TELEGRAM_CHAT_ID = ''; // أدخل معرف الدردشة هنا

/**
 * إرسال إشعار للتيليجرام
 */
function sendTelegramNotification(data) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }
  
  try {
    const actionEmoji = data.action === 'buy' ? '📈' : '📉';
    const actionText = data.action === 'buy' ? 'شراء' : 'بيع';
    
    const message = `
${actionEmoji} *توصية جديدة*

*الزوج:* ${data.symbol}
*النوع:* ${actionText}
*السعر:* ${data.price}
${data.stopLoss ? `*وقف الخسارة:* ${data.stopLoss}` : ''}
${data.takeProfit ? `*جني الأرباح:* ${data.takeProfit}` : ''}
${data.timeframe ? `*الإطار الزمني:* ${data.timeframe}` : ''}

_${data.notes}_
    `;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

// ============== اختبار السكربت ==============

/**
 * اختبار إرسال توصية تجريبية
 * يمكنك تشغيل هذه الدالة من محرر السكربت لاختبار الإعداد
 */
function testWebhook() {
  const testData = {
    symbol: 'EURUSD',
    action: 'buy',
    price: 1.0850,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    timeframe: '1H',
    notes: 'توصية تجريبية للاختبار'
  };
  
  const result = sendRecommendation(testData);
  console.log('Test result:', result);
  
  return result;
}

/**
 * إنشاء تنبيه TradingView للنسخ
 */
function generateTradingViewAlert() {
  const webhookUrl = ScriptApp.getService().getUrl();
  
  const alertMessage = `
// تنبيه TradingView - انسخ هذا في خانة الرسالة:
{
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "stopLoss": {{strategy.order.price}} * 0.99,
  "takeProfit": {{strategy.order.price}} * 1.02,
  "timeframe": "{{interval}}",
  "notes": "توصية آلية من TradingView"
}

// رابط Webhook: ${webhookUrl}
  `;
  
  console.log(alertMessage);
  return alertMessage;
}
