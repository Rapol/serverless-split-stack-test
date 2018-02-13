# Bug

This repo demonstrate a serverless deployment error when using serverless-aws-documentation and
serverless-plugin-split-stacks. The issue is encountered when defining a "commonModelSchemaFragments" section in the documentation.yml
to reuse method responses in multiple http event methodResponses definition.

# Current Behavior

Code to reproduce error is available here https://github.com/Rapol/serverless-split-stack-test

Steps to reproduce:
* Clone repo and checkout branch failed/documentation/common-models
* serverless deploy -v -r {region} -s {stage} --aws-profile {profile}
* It will fail while deploying the Methods stack with the following error:

```
Invalid model name specified: $ref=$["Resources"]["ApiGatewayMethodThingsPost"]["Properties"]["MethodResponses"][6]["ResponseModels"]
```

# Expected behavior

It should reference the name of the Model instead of using a broken $ref

This exact project structure was working previously with only the serverless-aws-documentation plugin.
Deployment broke when using both plugins.

# Environment

node -v v8.9.4
sls -v 1.25.0
serverless-plugin-split-stacks -v 1.4.1
serverless-aws-documentation -v 1.0 (PR = https://github.com/ebouther/serverless-aws-documentation.git#fix/split-stacks-plugin-compatibility)

# Additional Info

The problem arises when a methodResponse defined in the documentation.yml is referenced in two or more function events method response. IE:

```
methodResponses:
  -
    statusCode: "200"
    responseModels:
      "application/json": "StatusResponse"
  - "${self:custom.documentation.commonModelSchemaFragments.MethodResponse429Json}"  <-----
  - "${self:custom.documentation.commonModelSchemaFragments.MethodResponse500Json}"
```

I have included the .serverless folder for debugging purposes. Master branch has the files of a successful deployment. The method definition looks like this
in the cloudformation-template-Methods-nested-stack.json:

```
"ApiGatewayMethodThingsPut": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        ...
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseModels": {
              "application/json": "StatusResponse"
            }
          },
          {
            "StatusCode": "500",
            "ResponseModels": {
              "application/json": "CustomError"
            }
          }
        ]
},
```

In the failed/documentation/common-models branch, we can see the difference between the two when adding a methodResponse (429) that is
already been used in another methodResponse:

```
"ApiGatewayMethodThingsPut": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        ...
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseModels": {
              "application/json": "StatusResponse"
            }
          },
          {
            "StatusCode": "429",
            "ResponseModels": {
              "$ref": "$[\"Resources\"][\"ApiGatewayMethodThingsPost\"][\"Properties\"][\"MethodResponses\"][6][\"ResponseModels\"]"
            }
          },
          {
            "StatusCode": "500",
            "ResponseModels": {
              "application/json": "CustomError"
            }
          }
        ]
},
```

The 429 response is not replaced with the name of the model, even though the model was successfully referenced in the
second method ApiGatewayMethodThingsPost which is defined before in the same cloudformation.

Compare changes here:
https://github.com/Rapol/serverless-split-stack-test/compare/failed/documentation/common-models