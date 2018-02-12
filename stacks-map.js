const stacksMap = require('serverless-plugin-split-stacks').stacksMap;

stacksMap['AWS::ApiGateway::Method'] = { destination: 'Methods' };
stacksMap['AWS::ApiGateway::Model'] = { destination: 'Models' };