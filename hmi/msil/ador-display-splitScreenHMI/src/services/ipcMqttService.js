// services/ipcMqttService.js

class IpcMqttService {
    constructor(ipcClient) {
      this.ipcClient = ipcClient;
    }
  
    setup() {
      if (!this.ipcClient) {
        console.error("IPC MQTT client is not defined.");
        return;
      }
  
      this.ipcClient.on("connect", () => {
        console.log("connected to IPC MQTT broker...");
      });
  
      this.ipcClient.subscribe(["ocpp-client", "whitelist-service"]);
  
      this.ipcClient.on("message", (topic, payload) => {
        try {
          payload = JSON.parse(payload);
        } catch (error) {
          console.error("Invalid JSON payload:", error);
        }
  
        ["auth-res", "reset", "remoteauth"].forEach((eventName) => {
          window.dispatchEvent(
            new CustomEvent(eventName, { bubbles: true, detail: payload })
          );
        });
      });
    }
  }
  
  export default IpcMqttService;
  