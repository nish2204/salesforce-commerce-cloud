var LibCreateRequest = require('*/cartridge/scripts/lib/LibCreateRequest');
var Utils = require('*/cartridge/scripts/common/Utils');
var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
var Logger = require('dw/system/Logger');

/**
* Function for confirmation Service Request for Klarna
* @param {string} orderNo - order number
* @param {Object} preferences - worldpay preferences
* @param {string} merchantCode - merchantCode configured in preference
* @return {Object} returns an JSON object
*/
function confirmationRequestKlarnaService(orderNo, preferences, merchantCode) {
    var errorCode;
    var errorMessage;
    var order = LibCreateRequest.createConfirmationRequestKlarna(orderNo, preferences, merchantCode);
    Logger.getLogger('worldpay').debug('confirmationRequestKlarna Request : ' + order);
    var responseObj = Utils.serviceCall(order, null, preferences, null);
    if (!responseObj) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = 'Empty Response';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObj && responseObj.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = responseObj.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    // parsing response
    var result = responseObj.object;
    var response = Utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('confirmationRequestKlarna Response : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = response.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}


/**
* This function is Service wrapper for Order Cancel or Refund.
* @param {string} orderNo - order number
* @param {string} merchantID - merchantID configured in preference
* @return {Object} returns an JSON object
*/
function initiateCancelOrderService(orderNo, merchantID) {
    var errorCode = '';
    var errorMessage = '';

    if (!orderNo) {
        return { error: true };
    }

    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();

    var order = LibCreateRequest.createCancelOrderRequest(orderNo, preferences, merchantID);
    var responseObj = Utils.serviceCall(order, null, preferences, merchantID);
    if (!responseObj) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = 'Empty Response';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObj && responseObj.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = responseObj.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    // parsing response
    var result = responseObj.object;
    var response = Utils.parseResponse(result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = response.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * This function is Service wrapper for Order Inquiry
 * @param {dw.order.PaymentMethod} paymentMthd - payment method
 * @param {dw.order.Order} orderObj - order Object
 * @param {string} merchantID - merchantID configured in preference
 * @return {Object} returns an JSON object
 */
function orderInquiryRequestService(paymentMthd, orderObj, merchantID) {
    var errorCode = '';
    var errorMessage = '';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);

    var order = LibCreateRequest.createOrderInquiriesRequest(orderObj.getOrderNo(), preferences, merchantID);
    // Logger.getLogger("worldpay").debug("orderInquiryRequestService Request Creation : "+order);
    var responseObject = Utils.serviceCall(order, null, preferences, merchantID);

    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = 'Empty Response';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = responseObject.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    var result = responseObject.object;
    var response = Utils.parseResponse(result);

    if (response.isError()) {
        errorMessage = response.getErrorMessage();
        errorCode = response.getErrorCode();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Service wrapper for Order Authorization for APM or redirect orders
 * @param {dw.value.Money} nonGiftCertificateAmnt - Non gift certificate amount
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @param {dw.customer.Customer} customer - Current customer
 * @param {dw.order.PaymentMethod} paymentMthd - payment method
 * @return {Object} returns an JSON object
 */
function authorizeOrderService(nonGiftCertificateAmnt, orderObj, paymentInstrument, customer, paymentMthd) {
    var errorCode = '';
    var errorMessage = '';
    var orderRequest = LibCreateRequest.createRequest(nonGiftCertificateAmnt, orderObj, paymentInstrument, customer);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Request Creation : ' + orderRequest);
    if (!orderRequest) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    var responseObject = Utils.serviceCall(orderRequest, null, preferences, null);   // Making Service Call and Getting Response

    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    var result = responseObject.object;
    var response = Utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Response string : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = Utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Service wrapper for 3D order second request service
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} request - current request
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment instrument object
 * @param {Object} preferences - worldpay preferences
 * @param {string} paRes - error code
 * @param {string} md - MD
 * @param {string} echoData - authorization response echoData string
 * @param {string} cardNumber -  cardNumber.
 * @param {string} encryptedData - encryptedData
 * @param {string} cvn - cvn
 * @return {Object} returns an JSON object
 */
function secondAuthorizeRequestService(orderObj, request, paymentIntrument, preferences, paRes, md, echoData, cardNumber, encryptedData, cvn) {
    var errorCode = '';
    var errorMessage = '';
    var order = LibCreateRequest.createInitialRequest3D(orderObj, request, cvn, paymentIntrument, preferences, echoData, cardNumber, encryptedData);
    Logger.getLogger('worldpay').debug('SecondAuthorizeRequestService Request Creation : ' + order);
    /*
    var params = request.form;
    var paRes = (params.containsKey(WorldpayConstants.PARES))? params.get(WorldpayConstants.PARES)[0] : null;
    var md =   (params.containsKey(WorldpayConstants.MD))? params.get(WorldpayConstants.MD)[0] : null;
    */

    order = LibCreateRequest.createSecondOrderMessage(order, paRes, md);
    Logger.getLogger('worldpay').debug('SecondAuthorizeRequestService Request Creation : ' + order);
    if (!order) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var requestHeader = paymentIntrument.custom.resHeader;
    var responseObject = Utils.serviceCall(order, requestHeader, preferences, null);


    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('SecondAuthorizeRequestService Response string : ' + result);
    var response = Utils.parseResponse(result);

    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = Utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Function to authorize 3d version2
 * @param {string} orderNo - order number
 * @param {Object} request - Request
 * @param {Object} preferences - worldpay preferences
 * @return {XML} returns a XML
 */
function secondAuthorizeRequestService2(orderNo, request, preferences) {
    var errorCode = '';
    var errorMessage = '';
    var order = LibCreateRequest.createInitialRequest3D2(orderNo, request, preferences);
    Logger.getLogger('worldpay').debug('SecondAuthorizeRequestService Request Creation : ' + order);
    if (!order) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var responseObject = Utils.serviceCall(order, null, preferences, null);
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = Utils.parseResponse(result);

    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = Utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}

/**
 * Service wrapper for Credit Card orders
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} request - current request
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment instrument object
 * @param {Object} preferences - worldpay preferences
 * @param {string} cardNumber -  cardNumber.
 * @param {string} encryptedData - encryptedData
 * @param {string} cvn - cvn
 * @return {Object} returns an JSON object
 */
function ccAuthorizeRequestService(orderObj, request, paymentIntrument, preferences, cardNumber, encryptedData, cvn) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var isSavedRedirectCard;
    var order;

    var apmName = paymentIntrument.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    if (paymentMthd.ID === WorldpayConstants.WORLDPAY && paymentIntrument.creditCardToken) {
        isSavedRedirectCard = true;
    }

    var errorCode = '';
    var errorMessage = '';

    if (isSavedRedirectCard) {
        order = LibCreateRequest.createSavedCardAuthRequest(orderObj, request, cvn, paymentIntrument, preferences, null, cardNumber, encryptedData);
    } else {
        order = LibCreateRequest.createInitialRequest3D(orderObj, request, cvn, paymentIntrument, preferences, null, cardNumber, encryptedData);
    }


    if (!order) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    var responseObject = Utils.serviceCall(order, null, preferences, null);
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = Utils.parseResponse(result);


    // checks if any error occurs
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = Utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}

/**
 * Service wrapper for Lookup service
 * @param {string} country - country
 * @return {Object} returns an JSON object
 */
function apmLookupService(country) {
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var errorCode = '';
    var errorMessage = '';
    var content = '';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var requestXML = new XML('<paymentService version=\'' + preferences.XMLVersion + '\' merchantCode=\'' + preferences.merchantCode + '\'><inquiry><paymentOptionsInquiry countryCode=\'' + country + '\'/></inquiry></paymentService>');// eslint-disable-line
    Logger.getLogger('worldpay').debug('APMLookupService Request : ' + requestXML);
    var responseObject = Utils.serviceCall(requestXML, null, preferences, null);
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    // Read response
    try {
        content = new XML(responseObject.object);// eslint-disable-line
        Logger.getLogger('worldpay').debug('APMLookupService Response : ' + content);
    } catch (ex) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = Utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage + ' : ' + ex);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var ArrayList = require('dw/util/ArrayList');
    var APMList = new ArrayList();
    try {
        if (content.localName().equalsIgnoreCase(WorldpayConstants.XMLPAYMENTSERVICE)) {
            var temp = content;
            if (WorldpayConstants.XMLPAYMENTOPTION in temp.reply) {
                var Reader = require('dw/io/Reader');
                var XMLStreamReader = require('dw/io/XMLStreamReader');
                var XMLStreamConstants = require('dw/io/XMLStreamConstants');
                var fileReader = new Reader(temp.reply);
                var xmlStreamReader = new XMLStreamReader(fileReader);
                while (xmlStreamReader.hasNext()) {
                    if (xmlStreamReader.next() == XMLStreamConstants.START_ELEMENT) {// eslint-disable-line
                        var localElementName = xmlStreamReader.getLocalName();
                        if (localElementName.equalsIgnoreCase(WorldpayConstants.XMLPAYMENTOPTION)) {
                            var apmName = xmlStreamReader.readElementText();
                            APMList.addAt(0, apmName);
                        }
                    }
                }
                xmlStreamReader.close();
                fileReader.close();
                return { success: true, apmList: APMList };
            }

            errorCode = WorldpayConstants.NOTIFYERRORCODE111;
            errorMessage = Utils.getErrorMessage(errorCode);
            Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage);
            return { error: true, errorCode: errorCode, errorMessage: errorMessage };
        }

        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = Utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } catch (ex) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = Utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage + ' : ' + ex);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
}
/**
 * Service wrapper for Capture service
 * @param {string} orderCode - users's Order
 * @return {Object} returns an JSON object
 */
function createCaptureService(orderCode) {
    var errorCode = '';
    var errorMessage = '';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var ArrayList = require('dw/util/ArrayList');
    var OrderMgr = require('dw/order/OrderMgr');
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var order = OrderMgr.getOrder(orderCode);
    var shipmentUUIDList = new ArrayList();
    // iterate each shipment in order
    for (var i = 0; i < order.shipments.length; i++) {
        shipmentUUIDList.push(order.shipments[i].UUID);
    }
    // Capture Service Call
    var orderXML = LibCreateRequest.createCaptureServiceRequest(preferences, order.orderNo, order.adjustedMerchandizeTotalPrice.value, order.currencyCode, WorldpayConstants.DEBITCREDITINDICATOR, shipmentUUIDList);
    Logger.getLogger('worldpay').debug('Capture Service Request : ' + orderXML);
    var responseObj = Utils.serviceCall(orderXML, null, preferences, null);
    if (!responseObj) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = 'Empty Response';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObj && responseObj.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = responseObj.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    // parsing response
    var result = responseObj.object;
    Logger.getLogger('worldpay').debug('Capture Service Response : ' + result);
    var response = Utils.parseResponse(result);


    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = response.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}
/**
 * Service wrapper for VoidSale service
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} paymentMthd - Current payment method
 * @return {Object} returns an JSON object
 */
function voidSaleService(orderObj, paymentMthd) {
    var errorCode = '';
    var errorMessage = '';
    var orderRequest = LibCreateRequest.createVoidRequest(orderObj, paymentMthd);
    Logger.getLogger('worldpay').debug('VoidSale Request Creation : ' + orderRequest);
    if (!orderRequest) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    var responseObject = Utils.serviceCall(orderRequest, null, preferences, null);   // Making Service Call and Getting Response

    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    var result = responseObject.object;
    var response = Utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Response string : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = Utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}
/**
 * Service wrapper for Create Token from My Account
 * @param {Object} customer - customer object
 * @param {Object} paymentInstrument - PaymentInstrument
 * @param {Object} preferences - worldpay preferences
 * @param {number} cardNumber - Card Number
 * @param {number} expirationMonth - Expiration Month
 * @param {number} expirationYear - Expiration Year
 * @return {Object} returns an JSON object
 */
function createTokenWOP(customer, paymentInstrument, preferences, cardNumber, expirationMonth, expirationYear) {
    var errorCode = '';
    var errorMessage = '';
    var order = LibCreateRequest.createTokenRequestWOP(customer, paymentInstrument, preferences, cardNumber, expirationMonth, expirationYear);
    if (!order) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var responseObject = Utils.serviceCall(order, null, preferences, null);
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = Utils.parseResponse(result);
    // checks if any error occurs
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = Utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}

/**
 * Function to create request for deleting payment token from Account dashboard
 * @param {Object} payment - PaymentInstrument
 * @param {string} customerNo - Customer Number
 * @param {Object} preferences - worldpay preferences
 * @return {Object} returns an JSON object
 */
function deleteToken(payment, customerNo, preferences) {
    var errorCode = '';
    var errorMessage = '';
    var deleteTokenReq = LibCreateRequest.deletePaymentToken(payment, customerNo, preferences);
    if (!deleteTokenReq) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    var responseObject = Utils.serviceCall(deleteTokenReq, null, preferences, null);
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = Utils.parseResponse(result);
    // checks if any error occurs
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = Utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}
module.exports.initiateCancelOrderService = initiateCancelOrderService;
module.exports.authorizeOrderService = authorizeOrderService;
module.exports.orderInquiryRequestService = orderInquiryRequestService;
module.exports.secondAuthorizeRequestService = secondAuthorizeRequestService;
module.exports.secondAuthorizeRequestService2 = secondAuthorizeRequestService2;
module.exports.apmLookupService = apmLookupService;
module.exports.ccAuthorizeRequestService = ccAuthorizeRequestService;
module.exports.createCaptureService = createCaptureService;
module.exports.confirmationRequestKlarnaService = confirmationRequestKlarnaService;
module.exports.voidSaleService = voidSaleService;
module.exports.createTokenWOP = createTokenWOP;
module.exports.deleteToken = deleteToken;
