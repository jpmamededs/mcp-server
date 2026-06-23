import azure.functions as func
import json
import logging

app = func.FunctionApp()

@app.mcp_tool()
def b3mcp(context):
    return "Hello I am MCPTool!"
