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

module.exports = {
  safeAsyncCall,
};
