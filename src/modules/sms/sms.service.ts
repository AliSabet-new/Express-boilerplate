import {
  FARAZ_SMS_OTP_PATTERN_ID,
  FARAZ_SMS_NUMBER1,
  FARAZ_SMS_NUMBER2,
} from "@/common/constants";

import {
  HttpClient,
  httpClientInstance,
} from "@/modules/sms/http/http-client";

class SmsService {
  private NUMBER1: string;
  private NUMBER2: string;
  private OTP_PATTERN_ID: string;

  constructor(private readonly httpClient: HttpClient) {
    this.NUMBER1 = FARAZ_SMS_NUMBER1;
    this.NUMBER2 = FARAZ_SMS_NUMBER2;
    this.OTP_PATTERN_ID = FARAZ_SMS_OTP_PATTERN_ID;
  }

  async sendOTP(phone: string, code: string) {
     try {
      await this.httpClient.smsApi().post("/", {
        code: this.OTP_PATTERN_ID,
        sender: Math.random() > 0.5 ? this.NUMBER1 : this.NUMBER2,
        recipient: phone,
        variable: {
          code,
        },
      });
     } catch (error) {
       throw error;
     }
  }
}

export const smsServiceInstance = new SmsService(httpClientInstance);
export { SmsService };
