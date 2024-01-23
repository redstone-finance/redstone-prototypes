async function safeAsyncCall(
  asyncFunction,
  maxRetries = 5,
  retryInterval = 5 * 1000 // 5 seconds
) {
  let retries = 0;
  async function execute() {
    try {
      return await asyncFunction();
    } catch (error) {
      retries++;
      if (retries <= maxRetries) {
        // if (retries % 3 == 0) {
        //   console.log(`Retrying... (${retries}/${maxRetries})`);
        // }
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
        return execute();
      } else {
        // console.error(
        //   `Max retries reached. Exiting. Function: ${asyncFunction}`
        // );
        throw error;
      }
    }
  }
  return await execute();
}

async function safeAsyncCallWithDefaultZero(
  asyncFunction,
  maxRetries = 3,
  retryInterval = 3 * 1000 // 3 seconds
) {
  let retries = 0;
  async function execute() {
    try {
      return await asyncFunction();
    } catch (error) {
      retries++;
      if (retries <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
        return execute();
      } else {
        return 0;
      }
    }
  }
  return await execute();
}

module.exports = {
  safeAsyncCall,
  safeAsyncCallWithDefaultZero,
};
