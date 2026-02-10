import axios from "axios";

import { FARAZ_SMS_BASE_URL, FARAZ_SMS_API_KEY } from "@/common/constants";

class HttpClient {
  private BASE_URL: string;
  private API_KEY: string;

  constructor() {
    this.BASE_URL = FARAZ_SMS_BASE_URL;
    this.API_KEY = FARAZ_SMS_API_KEY;
  }

  public smsApi = () => {
    return axios.create({
      baseURL: this.BASE_URL,
      headers: {
        "Content-Type": "application/json",
        apikey: this.API_KEY,
      },
    });
  };
}

export const httpClientInstance = new HttpClient();
export { HttpClient };
