from web3 import Web3
import os
from dotenv import load_dotenv

# Replace with the function name and its parameters (types)
function_signature = "getRoundData(uint80)"

load_dotenv()
infura_api_key = os.environ["INFURA_API_KEY"]

web3 = Web3(Web3.HTTPProvider("https://mainnet.infura.io/v3/" + infura_api_key))

function_signature_bytes = Web3.keccak(text=function_signature).hex()[:10]

print("Signature of function:", function_signature_bytes)
