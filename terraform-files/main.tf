provider "aws" {
  region = var.aws_region
}

# Security Group for Worker Nodes
resource "aws_security_group" "sg_worker" {
  name        = "sg_worker"
  description = "Allow all traffic for Worker nodes"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # -1 means all protocols
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Master Node
resource "aws_security_group" "sg_master" {
  name        = "sg_master"
  description = "Allow specific ports for Master node and SSH access"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # SSH access from anywhere
  }

  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 2379
    to_port     = 2380
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 10259
    to_port     = 10259
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 10257
    to_port     = 10257
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Create an AWS Key Pair using the generated public key
resource "aws_key_pair" "master_key" {
  key_name   = "master-key"
  public_key = var.ssh_public_key

  lifecycle {
    create_before_destroy = true
  }
}

# Create the Master instance with SSH access
resource "aws_instance" "ec2_instance_master" {
  ami           = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.sg_master.id]

  key_name = aws_key_pair.master_key.key_name

  user_data = <<-EOF
              #!/bin/bash
              mkdir -p /home/ubuntu/.ssh
              echo "${var.ssh_public_key}" >> /home/ubuntu/.ssh/authorized_keys
              sudo chmod 700 /home/ubuntu/.ssh
              sudo chmod 600 /home/ubuntu/.ssh/authorized_keys
              sudo chown -R ubuntu:ubuntu /home/ubuntu/.ssh
            EOF

  tags = {
    Name = "Master"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Create the Worker instances with SSH access
resource "aws_instance" "ec2_instance_worker" {
  count         = var.ec2_count
  ami           = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.sg_worker.id]

  key_name = aws_key_pair.master_key.key_name

  user_data = <<-EOF
              #!/bin/bash
              mkdir -p /home/ubuntu/.ssh
              echo "${var.ssh_public_key}" >> /home/ubuntu/.ssh/authorized_keys
              sudo chmod 700 /home/ubuntu/.ssh
              sudo chmod 600 /home/ubuntu/.ssh/authorized_keys
              sudo chown -R ubuntu:ubuntu /home/ubuntu/.ssh
            EOF

  tags = {
    Name = "Worker-${count.index + 1}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# S3 bucket for SSH
resource "aws_s3_bucket" "ssh_key_bucket" {
  bucket = "k8s-infra-ssh-key"

  tags = {
    Name = "SSH Key Bucket"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Upload the SSH key to the S3 bucket
resource "aws_s3_object" "object" {
  bucket = aws_s3_bucket.ssh_key_bucket.bucket  # Reference the bucket resource directly
  key    = "ssh-key.pem"
  source = var.s3_object_source

  depends_on = [aws_s3_bucket.ssh_key_bucket]   # Ensure the bucket exists before uploading

  lifecycle {
    create_before_destroy = true
  }
}
