pipeline {
  agent any

  triggers {
    // Triggered instantly by the GitHub webhook on push to main
    githubPush()
  }

  stages {
    stage('Clean Up Old Containers') {
      steps {
        sh '''
          cd /workspace/jxtechstudio
          echo "🧹 Cleaning up old containers..."
          docker compose down --remove-orphans || true
          docker rm -f jxtechstudio-web-1 2>/dev/null || true
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          cd /workspace/jxtechstudio
          echo "🔨 Building image..."
          docker compose build --no-cache
        '''
      }
    }

    stage('Deploy Container') {
      steps {
        sh '''
          cd /workspace/jxtechstudio
          echo "🚀 Deploying container..."
          docker compose up -d --force-recreate
        '''
      }
    }
  }

  post {
    success {
      echo '✅ Deployment successful!'
    }
    failure {
      echo '❌ Build failed! Check Jenkins logs.'
    }
  }
}
