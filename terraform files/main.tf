provider "aws" {
  region = var.aws_region
}

# Security Group for Worker Nodes (Allows all traffic)
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
}

# Security Group for Master Node (Specific Ports + SSH)
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
}

# Create the Master instance
resource "aws_instance" "ec2_instance_master" {
  ami           = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.sg_master.id]

  tags = {
    Name = "Master"
  }
}

# Create the Worker instances
resource "aws_instance" "ec2_instance_worker" {
  count         = var.ec2_count
  ami           = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.sg_worker.id]

  tags = {
    Name = "Worker-${count.index + 1}"
  }
}

# Output the public IPs of both Master and Worker instances
output "public_ips" {
  value = concat(
    [aws_instance.ec2_instance_master.public_ip],
    [for instance in aws_instance.ec2_instance_worker : instance.public_ip]
  )
}
