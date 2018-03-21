$(aws ecr get-login --no-include-email --region us-west-1)
docker build -t presence-bot/presence-bot-rest-api .
docker tag presence-bot/presence-bot-rest-api:latest 879970359011.dkr.ecr.us-west-1.amazonaws.com/presence-bot/presence-bot-rest-api:latest
docker push 879970359011.dkr.ecr.us-west-1.amazonaws.com/presence-bot/presence-bot-rest-api:latest