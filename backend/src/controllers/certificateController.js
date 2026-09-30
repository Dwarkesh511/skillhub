import crypto from 'crypto';
import prisma from '../config/db.js';

export const getCertificates = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        certificateNumber: true,
        courseId: true,
        issuedAt: true,
        pdfUrl: true,
        course: {
          select: { title: true }
        },
        user: {
          select: { name: true }
        }
      }
    });

    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      courseId: cert.courseId,
      courseTitle: cert.course.title,
      studentName: cert.user.name,
      issuedAt: cert.issuedAt,
      pdfUrl: cert.pdfUrl
    }));

    return res.status(200).json({
      success: true,
      count: formattedCertificates.length,
      certificates: formattedCertificates
    });
  } catch (error) {
    next(error);
  }
};

export const getCertificateById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: {
        id,
        userId
      },
      select: {
        id: true,
        certificateNumber: true,
        courseId: true,
        issuedAt: true,
        pdfUrl: true,
        course: {
          select: { title: true }
        },
        user: {
          select: { name: true }
        }
      }
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    return res.status(200).json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        courseId: certificate.courseId,
        courseTitle: certificate.course.title,
        studentName: certificate.user.name,
        issuedAt: certificate.issuedAt,
        pdfUrl: certificate.pdfUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateCertificate = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const courseId = parseInt(req.params.courseId, 10);

    // 1. Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // 2. Verify student enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this course.'
      });
    }

    // 3. Verify course completion
    if (enrollment.status !== 'COMPLETED' || enrollment.progressPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: 'Certificate is available only after completing the course.'
      });
    }

    // 4. Return existing certificate if available
    const existingCert = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: {
        id: true,
        certificateNumber: true,
        courseId: true,
        issuedAt: true,
        pdfUrl: true,
        course: { select: { title: true } },
        user: { select: { name: true } }
      }
    });

    if (existingCert) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already exists',
        certificate: {
          id: existingCert.id,
          certificateNumber: existingCert.certificateNumber,
          courseId: existingCert.courseId,
          courseTitle: existingCert.course.title,
          studentName: existingCert.user.name,
          issuedAt: existingCert.issuedAt,
          pdfUrl: existingCert.pdfUrl
        }
      });
    }

    // 5. Create new certificate
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certificateNumber = `SH-2026-${randomHex}`;

    const newCert = await prisma.certificate.create({
      data: {
        certificateNumber,
        userId,
        courseId,
        issuedAt: new Date(),
        pdfUrl: null
      },
      select: {
        id: true,
        certificateNumber: true,
        courseId: true,
        issuedAt: true,
        pdfUrl: true,
        course: { select: { title: true } },
        user: { select: { name: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: {
        id: newCert.id,
        certificateNumber: newCert.certificateNumber,
        courseId: newCert.courseId,
        courseTitle: newCert.course.title,
        studentName: newCert.user.name,
        issuedAt: newCert.issuedAt,
        pdfUrl: newCert.pdfUrl
      }
    });
  } catch (error) {
    next(error);
  }
};
