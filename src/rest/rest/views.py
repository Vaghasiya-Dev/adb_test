from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json, logging, os
from pymongo import MongoClient

mongo_uri = 'mongodb://' + os.environ["MONGO_HOST"] + ':' + os.environ["MONGO_PORT"]
db = MongoClient(mongo_uri)['test_db']

class TodoListView(APIView):

    def get(self, request):
        todos = list(db.todos.find({}, {'_id': 0}))
        return Response({'todos': todos}, status=status.HTTP_200_OK)

    def post(self, request):
        payload = request.data if hasattr(request, 'data') else json.loads(request.body or '{}')
        description = payload.get('description') if isinstance(payload, dict) else None

        if description is None or not str(description).strip():
            return Response({'error': 'Description is required'}, status=status.HTTP_400_BAD_REQUEST)

        todo = {'description': str(description).strip()}
        db.todos.insert_one(todo)
        return Response({'message': 'Todo created successfully'}, status=status.HTTP_201_CREATED)

